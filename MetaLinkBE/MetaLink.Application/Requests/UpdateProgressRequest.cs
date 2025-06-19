using MetaLink.Domain.Enums;

namespace MetaLink.Application.Requests
{
    public class UpdateProgressRequest
    {
        public int? SubLessonID { get; set; }
        public int? LessonID { get; set; }
        public TestTypeEnum? TestType { get; set; }
        public QuizTypeEnum? QuizType { get; set; }
    }
}
