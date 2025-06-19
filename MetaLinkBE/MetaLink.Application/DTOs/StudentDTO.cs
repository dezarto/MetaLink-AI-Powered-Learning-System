using Metalink.Domain.Enums;
using MetaLink.Domain.Enums;

namespace Metalink.Application.DTOs
{
    public class StudentDTO
    {
        public int StudentID { get; set; }
        public int UserID { get; set; }
        public int? SelectedAvatarID { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public int? Class { get; set; }
        public bool? Gender { get; set; }
        public int? GameLevel { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public DateTime? CreateDate { get; set; }
        public DateTime? UpdateDate { get; set; }
        public int? ThemeChoice { get; set; }
        public VoiceTypeEnum? VoiceType { get; set; }
        public bool LearningStyleCompleated { get; set; }
        public bool ColorBilndCompleated { get; set; }
        public LearningStyleEnum? LearningStyleType { get; set; }
        public string? Role { get; set; }
        public ColorBlindTypeEnum ColorBlindType { get; set; }
    }
}
