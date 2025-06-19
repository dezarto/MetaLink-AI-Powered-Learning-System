using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Entities
{
    public class ChatMessage
    {
        public int ChatMessageID { get; set; }
        public int StudentID { get; set; }
        public string ChatType { get; set; } // 'AssistantRobot', 'ContentAssistantRobot', 'TestAssistantRobot', 'QuizAssistantRobot', 'AvatarAssistantRobot'
        public string Role { get; set; } //'user' | 'assistant' | 'system'
        public string Message { get; set; }
        public DateTime CreateDate { get; set; }
    }
}