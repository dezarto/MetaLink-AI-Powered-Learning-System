namespace MetaLink.Application.Requests
{
    public class AskQuizAssistantRobotRequest
    {
        public int StudentId { get; set; }
        public int QuizId { get; set; }
        public string? UserMessage { get; set; }
    }
}
