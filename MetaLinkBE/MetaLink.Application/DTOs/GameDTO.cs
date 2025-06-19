using MetaLink.Domain.Enums;

namespace MetaLink.Application.DTOs
{
    public class GameDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public GameTypeEnum Type { get; set; } // Single, Online, Both
        public string Description { get; set; }
    }
}
