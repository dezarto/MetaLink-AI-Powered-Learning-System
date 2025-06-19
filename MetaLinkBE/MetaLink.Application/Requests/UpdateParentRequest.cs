namespace MetaLink.Application.Requests
{
    public class UpdateParentRequest
    {
        public string Email { get; set; }
        public string Pin { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Phone { get; set; }
        public bool IsActive { get; set; }
        public DateTime DateOfBirth { get; set; }
    }
}
