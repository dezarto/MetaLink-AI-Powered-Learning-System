namespace MetaLink.Domain.Entities
{
    public class Avatar
    {
        public int AvatarID { get; set; }
        public string AvatarName { get; set; }
        public string AvatarPath { get; set; }
        public double AvatarLevel { get; set; }
        public bool isActive { get; set; }
        public DateTime AvatarCreateDate { get; set; }
        public DateTime AvatarUpdateDate { get; set; }
    }
}
