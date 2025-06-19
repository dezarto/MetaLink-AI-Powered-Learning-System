namespace MetaLink.Application.Requests
{
    public class EducationContentRequest
    {
        public int StudentId { get; set; }
        public int SubLessonId { get; set; }
        public bool NewContent { get; set; }
        public string? UserMessage { get; set; }
    }
}
