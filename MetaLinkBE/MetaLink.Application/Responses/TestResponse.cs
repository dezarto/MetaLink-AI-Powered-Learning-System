using MetaLink.Domain.Enums;

namespace MetaLink.Application.Responses
{
    public class TestResponse
    {
        public int TestID { get; set; }
        public int? SubLessonID { get; set; }
        public int? LessonID { get; set; }
        public TestTypeEnum TestType { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime CreateDate { get; set; }
        public int DurationInMilliseconds { get; set; }
        public bool IsSolved { get; set; }
        public int? Status { get; set; }
        public bool IsReviewSession { get; set; } = false;
        public List<TestQuestionResponse>? TestQuestions { get; set; }
    }

    public class TestQuestionResponse
    {
        public int QuestionID { get; set; }
        public string? NumberOfQuestion { get; set; }
        public int TestID { get; set; }
        public string QuestionText { get; set; }

        public List<TestQuestionOptionResponse> TestQuestionOptions { get; set; }
    }

    public class TestQuestionOptionResponse
    {
        public int OptionID { get; set; }
        public int QuestionID { get; set; }
        public string OptionText { get; set; }
        public bool IsCorrect { get; set; }
        public bool? isSelected { get; set; }
    }

    public class RawTestResponse
    {
        public RawTest Test { get; set; }
    }

    public class RawTest
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public List<RawQuestion> Questions { get; set; }
    }

    public class RawQuestion
    {
        public string QuestionText { get; set; }
        public List<RawOption> Options { get; set; }
    }

    public class RawOption
    {
        public string OptionText { get; set; }
        public bool IsCorrect { get; set; }
    }
}
