namespace MetaLink.Domain.Entities
{
    public class ChatGptMessage
    {
        public string role { get; set; } // "system", "user", "assistant"
        public string content { get; set; } // Mesaj içeriği
    }

    public class ChatGptResponse
    {
        public string response { get; set; } // ChatGPT'den gelen yanıt
        public byte[]? audio { get; set; }
        public string? requestMessage { get; set; }
    }

    public class UserMessage
    {
        public int StudentId { get; set; }
        public string message { get; set; }
        public bool VoiceEnable { get; set; }
    }
}
