using MetaLink.Domain.Enums;

namespace MetaLink.Application.Requests
{
    public class CreateGameRequest
    {
        public string Name { get; set; }
        public GameTypeEnum Type { get; set; }
        public string Description { get; set; }
    }
}
