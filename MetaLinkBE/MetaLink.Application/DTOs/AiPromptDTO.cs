using MetaLink.Domain.Enums;

namespace Metalink.Application.DTOs
{
    public class AiPromptDTO
    {
        public int PromptID { get; set; }
        public ContentTypeEnum ContentType { get; set; }
        public string PromptText { get; set; }
        public DateTime CreateDate { get; set; }
    }
}
