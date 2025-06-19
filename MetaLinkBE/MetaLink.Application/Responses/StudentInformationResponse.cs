using MetaLink.Domain.Enums;

namespace MetaLink.Application.Responses
{
    public class StudentInformationResponse
    {
        public int StudentID { get; set; }
        public int SelectedAvatarID { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public int Class { get; set; }
        public bool Gender { get; set; }
        public int GameLevel { get; set; }
        public AvatarChatTypeEnum AvatarChatType { get; set; }
        public VoiceTypeEnum VoiceType { get; set; }
        public DateTime DateOfBirth { get; set; }
        public int ThemeChoice { get; set; }
        public string Role { get; set; } = "Student";
    }
}
