using MetaLink.Domain.Enums;

namespace MetaLink.Domain.Entities
{
    public class XPRecord
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public int GameId { get; set; }
        public int XPAmount { get; set; }
        public XPType XPStatus { get; set; }
        public string? Description { get; set; }
        public DateTime EarnedAt { get; set; }
    }
}
