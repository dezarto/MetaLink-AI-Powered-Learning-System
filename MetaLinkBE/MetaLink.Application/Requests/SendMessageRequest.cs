namespace MetaLink.Application.Requests
{
    public class SendMessageRequest
    {
        public int SenderId { get; set; }
        public int ReceiverId { get; set; }
        public string Content { get; set; }
    }
}
