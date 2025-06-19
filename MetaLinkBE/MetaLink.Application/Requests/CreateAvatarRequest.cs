namespace MetaLink.Application.Requests
{
    public class CreateAvatarRequest
    {
        public string AvatarName { get; set; }
        public float AvatarLevel { get; set; }
        public bool isActive { get; set; }
        public string Base64Image { get; set; }
    }
}
