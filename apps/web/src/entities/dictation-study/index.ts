export { getDictationProgress, resetDictationProgress, submitDictationAnswer } from "./api/progress";
export { getDictationVideo } from "./api/video";
export { getDictationVideoDocumentPath } from "./lib/videoPath";
export { isDictationAnswerCorrect, normalizeDictationAnswer } from "./model/answer";
export {
  getDictationProgressQueryOptions,
  setDictationProgressQueryData,
} from "./model/progressQuery";
export { getDictationProgressQueryKey, getDictationVideoQueryKey } from "./model/queries";
export type {
  DictationProgress,
  DictationSegment,
  DictationVideo,
} from "./model/types";
export { useDictationProgressQueries } from "./model/useDictationProgressQueries";
export { useDictationProgressQuery } from "./model/useDictationProgressQuery";
export { useDictationVideoQuery } from "./model/useDictationVideoQuery";
