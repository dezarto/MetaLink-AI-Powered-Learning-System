namespace MetaLink.Application.Requests
{
    public class GenerateTest
    {
        public int StudentId { get; set; }
        public int? SubLessonId { get; set; }
        public int? LessonId { get; set; }
        public bool QuickTest { get; set; }
        public bool NormalTest { get; set; }
        public bool GeneralTest { get; set; }
        public bool IsReviewSession { get; set; } = false;
    }
}
