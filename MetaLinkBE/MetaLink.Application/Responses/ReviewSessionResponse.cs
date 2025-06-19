using MetaLink.Domain.Enums;

namespace MetaLink.Application.Responses
{
    public class ReviewSessionResponse
    {
        public int ReviewSessionId { get; set; }
        public int StudentId { get; set; }
        public int SubLessonId { get; set; }
        public string SubLessonName { get; set; }
        public ReviewSessionDataResponse ReviewSessionData { get; set; }
    }

    public class ReviewSessionDataResponse
    {
        public int FailCount { get; set; }
        public ReviewSessionTypeEnum ReviewSessionType { get; set; }
        public bool IsTestSolved { get; set; }
        public bool IsCompleted { get; set; }
        public string TestJsonData { get; set; }
        public string TestAnswerJsonData { get; set; }
        public string ContentText { get; set; }
        public string SummaryText { get; set; }
        public string ContentImageOne { get; set; }
        public string ContentImageTwo { get; set; }
        public string ContentImageThree { get; set; }
        public string SummaryImageOne { get; set; }
        public string SummaryImageTwo { get; set; }
        public DateTime CreateDate { get; set; }
    }
}
