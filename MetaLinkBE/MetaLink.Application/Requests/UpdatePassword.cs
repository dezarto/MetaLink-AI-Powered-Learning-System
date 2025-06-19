namespace MetaLink.Application.Requests
{
    public class UpdatePassword
    {
        public string OldPassword { get; set; }
        public string NewPassword { get; set; }
        public string ConfirmNewPassword { get; set; }
    }
}
