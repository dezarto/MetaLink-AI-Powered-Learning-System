namespace MetaLink.Application.Requests
{
    public class UpdateStudentRequest
    {
        public int ParentId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public int Class { get; set; }
        public bool Gender { get; set; }
        public DateTime DateOfBirth { get; set; }
    }
}
