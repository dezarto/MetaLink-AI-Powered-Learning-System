namespace MetaLink.Application.DTOs
{
    public class StudentFriendshipDTO
    {
        public int Id { get; set; }
        public int RequesterStudentId { get; set; }
        public int TargetStudentId { get; set; }
        public string Status { get; set; } // "Pending", "Accepted", "Rejected"
        public DateTime RequestedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
        public int BlockerId { get; set; }
        public bool IsDeleted { get; set; }
        public bool IsBlocked { get; set; }
        public bool IsCanceled { get; set; }
    }
}
