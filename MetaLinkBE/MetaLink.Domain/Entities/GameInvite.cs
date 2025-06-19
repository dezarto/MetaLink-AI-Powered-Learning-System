namespace MetaLink.Domain.Entities
{
    public class GameInvite
    {
        public int Id { get; set; }
        public int FromStudentId { get; set; }
        public int ToStudentId { get; set; }
        public int GameId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime AcceptedAt { get; set; }
        public bool IsAccepted { get; set; }
        public bool IsCancelled { get; set; }
    }
}
