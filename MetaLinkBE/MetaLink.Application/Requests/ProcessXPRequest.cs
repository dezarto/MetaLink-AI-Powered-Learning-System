using MetaLink.Domain.Enums;

namespace MetaLink.Application.Requests
{
    public class ProcessXPRequest
    {
        public int StudentId { get; set; }
        public int GameId { get; set; }
        public int Amount { get; set; }
        public XPType XPType { get; set; }
        public string? Description { get; set; }
    }
}
