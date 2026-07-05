"""
ChronosIntel — Smart Text Chunker
===================================
Splits large document text into overlapping chunks for Cognee ingestion.

Strategy:
  1. Split on sentence boundaries (period, newline, etc.)
  2. Accumulate sentences until reaching chunk_size (word count proxy)
  3. Overlap last N words of previous chunk into next chunk

This preserves semantic context at chunk boundaries.
"""

from __future__ import annotations

import re
import logging
from dataclasses import dataclass

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class TextChunk:
    """A single text chunk with position metadata."""

    text: str
    index: int             # chunk index (0-based)
    start_word: int        # approximate word offset in source
    end_word: int
    is_first: bool = False
    is_last: bool = False

    @property
    def word_count(self) -> int:
        return len(self.text.split())


class TextChunker:
    """
    Sentence-aware text chunker with configurable size and overlap.

    Args:
        chunk_size:   Target number of words per chunk.
        chunk_overlap: Number of words to overlap between consecutive chunks.

    Usage::

        chunker = TextChunker(chunk_size=512, chunk_overlap=64)
        chunks = chunker.chunk("Long document text here...")
    """

    # Sentence-ending punctuation followed by whitespace or end of string
    _SENTENCE_END = re.compile(r"(?<=[.!?])\s+|(?<=\n)\n+")

    def __init__(
        self,
        chunk_size: int | None = None,
        chunk_overlap: int | None = None,
    ) -> None:
        self.chunk_size = chunk_size or settings.chunk_size
        self.chunk_overlap = chunk_overlap or settings.chunk_overlap

    def chunk(self, text: str) -> list[TextChunk]:
        """
        Split text into overlapping chunks.

        Args:
            text: The full document text to split.

        Returns:
            List of TextChunk objects in order.
        """
        if not text or not text.strip():
            return []

        text = self._normalize(text)
        sentences = self._split_sentences(text)

        if not sentences:
            return []

        chunks: list[TextChunk] = []
        current_words: list[str] = []
        current_word_count = 0
        word_offset = 0

        for sentence in sentences:
            sentence_words = sentence.split()
            sentence_word_count = len(sentence_words)

            # If adding this sentence would exceed chunk_size, finalize current chunk
            if current_word_count + sentence_word_count > self.chunk_size and current_words:
                chunk_text = " ".join(current_words)
                chunks.append(
                    TextChunk(
                        text=chunk_text,
                        index=len(chunks),
                        start_word=word_offset - current_word_count,
                        end_word=word_offset,
                    )
                )

                # Keep overlap words from end of current chunk
                overlap_words = current_words[-self.chunk_overlap:] if self.chunk_overlap > 0 else []
                current_words = overlap_words + sentence_words
                current_word_count = len(current_words)
            else:
                current_words.extend(sentence_words)
                current_word_count += sentence_word_count

            word_offset += sentence_word_count

        # Finalize last chunk
        if current_words:
            chunk_text = " ".join(current_words)
            chunks.append(
                TextChunk(
                    text=chunk_text,
                    index=len(chunks),
                    start_word=word_offset - current_word_count,
                    end_word=word_offset,
                )
            )

        # Mark first/last
        if chunks:
            chunks[0].is_first = True
            chunks[-1].is_last = True

        logger.debug(
            "Chunked text: %d words → %d chunks (size=%d, overlap=%d)",
            word_offset,
            len(chunks),
            self.chunk_size,
            self.chunk_overlap,
        )
        return chunks

    def chunk_texts(self, texts: list[str]) -> list[list[TextChunk]]:
        """Chunk multiple texts, returning a list per input text."""
        return [self.chunk(t) for t in texts]

    def chunk_to_strings(self, text: str) -> list[str]:
        """Convenience method — returns plain strings instead of TextChunk objects."""
        return [c.text for c in self.chunk(text)]

    # ── Private ────────────────────────────────────────────────────────────────

    @staticmethod
    def _normalize(text: str) -> str:
        """Normalize whitespace while preserving paragraph breaks."""
        # Collapse runs of 3+ newlines to double newline
        text = re.sub(r"\n{3,}", "\n\n", text)
        # Collapse horizontal whitespace runs
        text = re.sub(r"[ \t]+", " ", text)
        return text.strip()

    def _split_sentences(self, text: str) -> list[str]:
        """Split text into sentences using a simple regex."""
        # Split on sentence-ending punctuation or double newlines
        raw_splits = self._SENTENCE_END.split(text)
        sentences: list[str] = []
        for raw in raw_splits:
            raw = raw.strip()
            if raw:
                sentences.append(raw)
        return sentences


# ── Module-level singleton ────────────────────────────────────────────────────
text_chunker = TextChunker()
