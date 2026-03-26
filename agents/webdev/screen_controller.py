from __future__ import annotations

import json
import time
import traceback
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests

SCREEN_PLAYLIST_URL = "http://192.168.1.119:8000/webdev/screen"
POLL_INTERVAL_SECONDS = 10
START_MARKER = "  // SCREEN_CONTROLLER:START"
END_MARKER = "  // SCREEN_CONTROLLER:END"
TARGET_PAGE = Path(__file__).resolve().parents[2] / "app" / "screen" / "page.tsx"


@dataclass(frozen=True)
class DisplaySlide:
    id: str
    titleLines: list[str]
    subtitle: str
    lines: list[str]


class ScreenController:
    def __init__(
        self,
        playlist_url: str = SCREEN_PLAYLIST_URL,
        target_page: Path = TARGET_PAGE,
        timeout_seconds: float = 5.0,
    ) -> None:
        self.playlist_url = playlist_url
        self.target_page = Path(target_page)
        self.timeout_seconds = timeout_seconds
        self._last_written_block: str | None = None
        self._session = requests.Session()
        self._session.trust_env = False

    def fetch_playlist(self) -> list[DisplaySlide]:
        payload = self._load_json(self.playlist_url)
        self._log_playlist_status(payload)
        return self._normalize_playlist(payload)

    def sync(self) -> bool:
        slides = self.fetch_playlist()
        print(f"[screen_controller] slides_received={len(slides)}")
        print(f"[screen_controller] calling write_page path={self.target_page}")
        changed = self.write_page(slides)
        print(f"[screen_controller] changed={changed}")
        return changed

    def write_page(self, slides: list[DisplaySlide]) -> bool:
        generated_block = self._render_generated_block(slides)

        if self._last_written_block == generated_block:
            print("[screen_controller] write skipped: same generated block as previous sync")
            return False

        current_content = self.target_page.read_text(encoding="utf-8")
        new_content = self._replace_generated_block(current_content, generated_block)

        if new_content == current_content:
            self._last_written_block = generated_block
            print("[screen_controller] write skipped: file content unchanged")
            return False

        self.target_page.write_text(new_content, encoding="utf-8")
        self._last_written_block = generated_block
        print("[screen_controller] file updated")
        return True

    def _load_json(self, url: str) -> Any:
        attempts = 2
        last_error: Exception | None = None

        for attempt in range(1, attempts + 1):
            try:
                print(f"[screen_controller] fetching_url={url} attempt={attempt}/{attempts}")
                response = self._session.get(url, timeout=self.timeout_seconds)
                print(f"[screen_controller] status_code={response.status_code}")
                response.raise_for_status()
                return response.json()
            except requests.RequestException as exc:
                last_error = exc
                print("[screen_controller] fetch failed with exception:")
                traceback.print_exc()

                if attempt < attempts:
                    time.sleep(1)

        if last_error is not None:
            raise last_error

        raise RuntimeError("Request failed without an exception")

    def _log_playlist_status(self, payload: Any) -> None:
        if isinstance(payload, dict):
            status = self._clean_text(payload.get("status")) or self._clean_text(
                payload.get("slide_type")
            )
            print(f"[screen_controller] playlist_status={status or 'unknown'}")
            for key in ("slides", "playlist", "items", "data"):
                value = payload.get(key)
                if isinstance(value, list):
                    print(f"[screen_controller] payload_list_key={key} payload_list_count={len(value)}")
                    return

            single_slide = payload.get("slide")
            print(
                "[screen_controller] payload_list_key=slide payload_list_count="
                f"{1 if isinstance(single_slide, dict) else 0}"
            )
            return

        if isinstance(payload, list):
            print("[screen_controller] playlist_status=list")
            print(f"[screen_controller] payload_list_key=root payload_list_count={len(payload)}")
            return

        print(f"[screen_controller] playlist_status=unsupported type={type(payload).__name__}")

    def _normalize_playlist(self, payload: Any) -> list[DisplaySlide]:
        items = self._extract_playlist_items(payload)
        slides: list[DisplaySlide] = []

        for index, raw_item in enumerate(items):
            slide = self._normalize_slide(raw_item, index=index)
            if slide is not None:
                slides.append(slide)

        return slides

    def _extract_playlist_items(self, payload: Any) -> list[Any]:
        if isinstance(payload, list):
            return payload

        if not isinstance(payload, dict):
            return []

        for key in ("playlist", "slides", "items", "data"):
            value = payload.get(key)
            if isinstance(value, list):
                return value

        status = self._clean_text(payload.get("status"))
        if status.lower() == "idle":
            return []

        slide_type = self._clean_text(payload.get("slide_type"))
        if slide_type.lower() == "idle":
            return []

        single_slide = payload.get("slide")
        if isinstance(single_slide, dict):
            return [single_slide]

        return []

    def _normalize_slide(self, raw_item: Any, *, index: int) -> DisplaySlide | None:
        item = raw_item if isinstance(raw_item, dict) else {}
        payload = item.get("slide") if isinstance(item.get("slide"), dict) else item

        title_lines = self._normalize_title_lines(
            payload.get("title") or payload.get("headline")
        )
        subtitle = self._clean_text(payload.get("subtitle") or payload.get("subheadline"))
        lines = self._normalize_lines(payload.get("lines"))

        cta = self._clean_text(payload.get("cta"))
        if cta and cta not in lines:
            lines.append(cta)

        if not title_lines or not subtitle:
            print(
                f"[screen_controller] skipped slide index={index} "
                f"title_lines={len(title_lines)} subtitle_present={bool(subtitle)}"
            )
            return None

        slide_id = (
            self._clean_text(payload.get("id"))
            or self._clean_text(item.get("id"))
            or self._clean_text(payload.get("product_slug"))
        )
        if not slide_id:
            slide_id = f"screen-slide-{index + 1}"

        return DisplaySlide(
            id=slide_id,
            titleLines=title_lines,
            subtitle=subtitle,
            lines=lines,
        )

    def _normalize_title_lines(self, value: Any) -> list[str]:
        if isinstance(value, list):
            return [line for line in (self._clean_text(item) for item in value) if line]

        title = self._clean_text(value)
        if not title:
            return []

        explicit_lines = [line.strip() for line in title.splitlines() if line.strip()]
        return explicit_lines or [title]

    def _normalize_lines(self, value: Any) -> list[str]:
        if isinstance(value, str):
            line = self._clean_text(value)
            return [line] if line else []

        if not isinstance(value, list):
            return []

        return [line for line in (self._clean_text(item) for item in value) if line]

    def _clean_text(self, value: Any) -> str:
        if value is None:
            return ""

        return str(value).strip()

    def _render_generated_block(self, slides: list[DisplaySlide]) -> str:
        if not slides:
            return ""

        rendered_lines: list[str] = []
        for slide in slides:
            payload = {
                "id": slide.id,
                "titleLines": slide.titleLines,
                "subtitle": slide.subtitle,
                "lines": slide.lines,
            }
            serialized = json.dumps(payload, ensure_ascii=False, indent=2)
            rendered_lines.extend(f"  {line}" for line in serialized.splitlines())
            rendered_lines[-1] = f"{rendered_lines[-1]},"

        return "\n".join(rendered_lines)

    def _replace_generated_block(self, content: str, generated_block: str) -> str:
        start_index = content.find(START_MARKER)
        end_index = content.find(END_MARKER)
        print(f"[screen_controller] marker_start_found={start_index != -1}")
        print(f"[screen_controller] marker_end_found={end_index != -1}")

        if start_index == -1 or end_index == -1 or end_index <= start_index:
            raise ValueError(
                f"Could not find screen controller markers in {self.target_page}"
            )

        insertion_start = start_index + len(START_MARKER)
        replacement = "\n"
        if generated_block:
            replacement = f"\n{generated_block}\n"

        return content[:insertion_start] + replacement + content[end_index:]


def run_loop(
    controller: ScreenController | None = None,
    interval_seconds: float = POLL_INTERVAL_SECONDS,
) -> None:
    controller = controller or ScreenController()

    while True:
        try:
            controller.sync()
        except (requests.RequestException, TimeoutError, ValueError, json.JSONDecodeError):
            print("[screen_controller] sync failed with exception:")
            traceback.print_exc()
        except Exception as exc:  # pragma: no cover
            print(f"[screen_controller] unexpected error: {exc}")
            traceback.print_exc()

        time.sleep(interval_seconds)


if __name__ == "__main__":
    run_loop()
