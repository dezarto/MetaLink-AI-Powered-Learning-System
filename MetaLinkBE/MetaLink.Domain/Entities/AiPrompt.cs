using System.ComponentModel.DataAnnotations;
using MetaLink.Domain.Enums;

namespace Metalink.Domain.Entities
{
    public class AiPrompt
    {
        [Key]
        public int PromptID { get; set; }
        public ContentTypeEnum ContentType { get; set; }
        public string PromptText { get; set; }
        public DateTime CreateDate { get; set; }
    }
}
