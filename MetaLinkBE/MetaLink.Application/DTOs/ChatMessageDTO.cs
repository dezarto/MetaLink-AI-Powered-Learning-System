namespace MetaLink.Application.DTOs
{
    public class ChatMessageDTO
    {
        public int ChatMessageID { get; set; }
        public int StudentID { get; set; }
        public string ChatType { get; set; } // 'AssistantRobot', 'ContentAssistantRobot', 'TestAssistantRobot', 'QuizAssistantRobot'
        public string Role { get; set; } //'user' | 'assistant' | 'system'
        public string Message { get; set; }
        public DateTime CreateDate { get; set; }
    }
}
