type DictionaryPopoverHorizontalLayout = {
  offset: number;
  width: number;
};

type HorizontalOverflow = {
  left: number;
  right: number;
};

type CalculatePopoverHorizontalLayoutOptions = {
  endOverflow: HorizontalOverflow;
  referenceWidth: number;
  startOverflow: HorizontalOverflow;
  width: number;
};

export function calculatePopoverHorizontalLayout({
  endOverflow,
  referenceWidth,
  startOverflow,
  width,
}: CalculatePopoverHorizontalLayoutOptions): DictionaryPopoverHorizontalLayout {
  if (startOverflow.left <= 0 && startOverflow.right <= 0) {
    return { offset: 0, width };
  }

  if (endOverflow.left <= 0 && endOverflow.right <= 0) {
    return { offset: referenceWidth - width, width };
  }

  const centeredWidth = Math.max(0, Math.min(width, width - startOverflow.left - startOverflow.right));
  const viewportCenterOffset = (startOverflow.left + width - startOverflow.right) / 2;

  return {
    offset: viewportCenterOffset - centeredWidth / 2,
    width: centeredWidth,
  };
}
