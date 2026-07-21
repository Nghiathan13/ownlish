import type { ContentEvidenceSegment } from "@/entities/toeic/api/types";

export const LANDING_VOCAB_DEMO_WORD = {
  word: "negotiate",
  type: "v.",
  band: "B2",
  ipaUk: "nɪˈɡəʊʃieɪt",
  meaningVi: "đàm phán, thương lượng",
  definition: "to discuss something in order to reach an agreement",
  example: "They negotiated a better contract with the supplier.",
  exampleVi: "Họ đã đàm phán một hợp đồng tốt hơn với nhà cung cấp.",
} as const;

export const LANDING_VOCAB_DEMO_METRICS = {
  due: 12,
  mastered: 48,
  difficult: 5,
} as const;

export type LandingOptionKey = "A" | "B" | "C" | "D";

export type LandingPart3Question = {
  id: string;
  number: number;
  prompt: string;
  promptVi: string;
  options: Record<LandingOptionKey, string>;
  optionsVi: Record<LandingOptionKey, string>;
  answerKey: LandingOptionKey;
};

export const LANDING_PART3_DEMO = {
  source: "ETS 2024 · Test 1 · Q68–70",
  audioSrc: "/landing/part3-sample.mp3",
  imageSrc: "/landing/part3-sample.avif",
  label: "Part 3",
  // From Documents/toeic/ets_24/test_01/part_3.json (group ets24-t01-p3-g068-070)
  transcriptSegments: [
    { type: "text", value: "M: " },
    {
      type: "evidence",
      questionNumbers: [68],
      value:
        "I'm glad we were assigned to cover the press conference earlier today.",
    },
    {
      type: "text",
      value:
        " I counted seven other major media networks there, in addition to ours.\n\nW: Well, the offshore wind industry is going to transform the way this region gets its power.\n\nM: Agreed. Let's compare our facts before we start writing.\n\nW: ",
    },
    {
      type: "evidence",
      questionNumbers: [69],
      value:
        "So the largest cluster of wind turbines – off the coast of Winston – is already built.",
    },
    {
      type: "text",
      value:
        " The other sites are at different stages of construction, though Lanchester is also close to being done.\n\nM: Right. ",
    },
    {
      type: "evidence",
      questionNumbers: [70],
      value:
        "And I think it's crucial for us to focus on how many new jobs related to assembling and maintaining the turbines are opening up in the area as a result of this.",
    },
  ] satisfies ContentEvidenceSegment[],
  transcriptViSegments: [
    { type: "text", value: "Nam: " },
    {
      type: "evidence",
      questionNumbers: [68],
      value:
        "Tôi mừng là chúng ta được phân công đưa tin về buổi họp báo sớm hôm nay.",
    },
    {
      type: "text",
      value:
        " Tôi đếm được bảy mạng lưới truyền thông lớn khác ở đó, ngoài mạng của chúng ta.\n\nNữ: À, ngành công nghiệp điện gió ngoài khơi sẽ thay đổi cách khu vực này lấy năng lượng.\n\nNam: Đồng ý. Hãy so sánh các dữ kiện của chúng ta trước khi bắt đầu viết.\n\nNữ: ",
    },
    {
      type: "evidence",
      questionNumbers: [69],
      value:
        "Vậy cụm tuabin gió lớn nhất – ngoài khơi bờ biển Winston – đã được xây dựng xong.",
    },
    {
      type: "text",
      value:
        " Các địa điểm khác đang ở các giai đoạn xây dựng khác nhau, mặc dù Lanchester cũng sắp hoàn thành.\n\nNam: Đúng vậy. ",
    },
    {
      type: "evidence",
      questionNumbers: [70],
      value:
        "Và tôi nghĩ điều quan trọng là chúng ta tập trung vào việc có bao nhiêu công việc mới liên quan đến lắp ráp và bảo trì các tuabin đang mở ra trong khu vực nhờ vào điều này.",
    },
  ] satisfies ContentEvidenceSegment[],
  questions: [
    {
      id: "ets24-t01-p3-q068",
      number: 68,
      prompt: "Who most likely are the speakers?",
      promptVi: "Những người nói có khả năng nhất là ai?",
      options: {
        A: "Urban planners",
        B: "Journalists",
        C: "Engineers",
        D: "Environmental scientists",
      },
      optionsVi: {
        A: "Các nhà quy hoạch đô thị",
        B: "Các nhà báo",
        C: "Các kỹ sư",
        D: "Các nhà khoa học môi trường",
      },
      answerKey: "B",
    },
    {
      id: "ets24-t01-p3-q069",
      number: 69,
      prompt: "Look at the graphic. Which site has already been completed?",
      promptVi: "Nhìn vào biểu đồ. Địa điểm nào đã được hoàn thành?",
      options: {
        A: "Site A",
        B: "Site B",
        C: "Site C",
        D: "Site D",
      },
      optionsVi: {
        A: "Địa điểm A",
        B: "Địa điểm B",
        C: "Địa điểm C",
        D: "Địa điểm D",
      },
      answerKey: "D",
    },
    {
      id: "ets24-t01-p3-q070",
      number: 70,
      prompt: "What does the man suggest focusing on?",
      promptVi: "Người đàn ông gợi ý tập trung vào điều gì?",
      options: {
        A: "Work opportunities",
        B: "Wind turbine costs",
        C: "Supply chain issues",
        D: "Power capacity",
      },
      optionsVi: {
        A: "Cơ hội việc làm",
        B: "Chi phí tuabin gió",
        C: "Các vấn đề về chuỗi cung ứng",
        D: "Công suất điện",
      },
      answerKey: "A",
    },
  ] satisfies LandingPart3Question[],
} as const;
