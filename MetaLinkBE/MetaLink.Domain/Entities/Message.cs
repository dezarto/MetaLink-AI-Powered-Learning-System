namespace MetaLink.Domain.Entities
{
    public class Message
    {
        public int Id { get; set; }
        public int SenderStudentId { get; set; }
        public int ReceiverStudentId { get; set; }
        public string MessageTXT { get; set; }
        public DateTime SentAt { get; set; }
        public bool IsRead { get; set; }
    }
}
