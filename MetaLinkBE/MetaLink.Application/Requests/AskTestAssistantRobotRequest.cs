namespace MetaLink.Application.Requests
{
    public class AskTestAssistantRobotRequest
    {
        public int StudentId { get; set; }
        public int TestId { get; set; }
        public string? UserMessage { get; set; }
        public bool IsReviewSession { get; set; } = false;
        public int? SublessonId { get; set; }
    }
}
