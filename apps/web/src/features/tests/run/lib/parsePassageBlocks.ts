import type { PassageBlock } from "@/features/tests/run/lib/passageContent.types";

type RawPassageBlock = Pick<PassageBlock, "type"> & { raw: string };

const PASSAGE_BLOCK_TAGS = {
  center: {
    open: "[center]",
    close: "[/center]",
  },
} as const;

type BlockTagName = keyof typeof PASSAGE_BLOCK_TAGS;

function findNextTag(
  content: string,
  fromIndex: number,
): { index: number; tag: BlockTagName; isClose: boolean } | null {
  let next: { index: number; tag: BlockTagName; isClose: boolean } | null = null;

  for (const tag of Object.keys(PASSAGE_BLOCK_TAGS) as BlockTagName[]) {
    const open = content.indexOf(PASSAGE_BLOCK_TAGS[tag].open, fromIndex);
    const close = content.indexOf(PASSAGE_BLOCK_TAGS[tag].close, fromIndex);

    for (const candidate of [
      open >= 0 ? { index: open, tag, isClose: false as const } : null,
      close >= 0 ? { index: close, tag, isClose: true as const } : null,
    ]) {
      if (!candidate) {
        continue;
      }

      if (!next || candidate.index < next.index) {
        next = candidate;
      }
    }
  }

  return next;
}

export function hasPassageFormatMarkers(content: string | null | undefined) {
  if (!content) {
    return false;
  }

  return Object.values(PASSAGE_BLOCK_TAGS).some(
    ({ open, close }) => content.includes(open) || content.includes(close),
  );
}

export function isValidPassageBlockMarkup(content: string) {
  const depth: Partial<Record<BlockTagName, number>> = {};

  for (const tag of Object.keys(PASSAGE_BLOCK_TAGS) as BlockTagName[]) {
    depth[tag] = 0;
  }

  let index = 0;

  while (index < content.length) {
    const nextTag = findNextTag(content, index);
    if (!nextTag) {
      break;
    }

    const { open, close } = PASSAGE_BLOCK_TAGS[nextTag.tag];

    if (nextTag.isClose) {
      if ((depth[nextTag.tag] ?? 0) === 0) {
        return false;
      }

      depth[nextTag.tag] = (depth[nextTag.tag] ?? 0) - 1;
      index = nextTag.index + close.length;
      continue;
    }

    if ((depth[nextTag.tag] ?? 0) > 0) {
      return false;
    }

    depth[nextTag.tag] = (depth[nextTag.tag] ?? 0) + 1;
    index = nextTag.index + open.length;
  }

  return Object.values(depth).every((value) => value === 0);
}

function trimBoundaryNewlines(blocks: RawPassageBlock[]): RawPassageBlock[] {
  return blocks.map((block, index) => {
    if (block.type !== "plain" || index === 0) {
      return block;
    }

    const previousBlock = blocks[index - 1];
    if (previousBlock?.type === "plain" || !block.raw.startsWith("\n")) {
      return block;
    }

    return {
      ...block,
      raw: block.raw.slice(1),
    };
  });
}

export function parsePassageBlocks(content: string): RawPassageBlock[] | null {
  if (!isValidPassageBlockMarkup(content)) {
    return null;
  }

  const blocks: RawPassageBlock[] = [];
  let plainStart = 0;
  let index = 0;

  while (index < content.length) {
    const nextTag = findNextTag(content, index);
    if (!nextTag || nextTag.isClose) {
      break;
    }

    const { open, close } = PASSAGE_BLOCK_TAGS[nextTag.tag];

    if (nextTag.index > plainStart) {
      blocks.push({
        type: "plain",
        raw: content.slice(plainStart, nextTag.index),
      });
    }

    const closeIndex = content.indexOf(close, nextTag.index + open.length);
    if (closeIndex === -1) {
      return null;
    }

    blocks.push({
      type: nextTag.tag,
      raw: content.slice(nextTag.index + open.length, closeIndex),
    });

    index = closeIndex + close.length;
    plainStart = index;
  }

  if (plainStart < content.length) {
    blocks.push({
      type: "plain",
      raw: content.slice(plainStart),
    });
  }

  return trimBoundaryNewlines(blocks);
}
