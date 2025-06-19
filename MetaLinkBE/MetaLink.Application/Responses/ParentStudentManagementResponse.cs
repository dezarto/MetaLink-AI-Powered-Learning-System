using Metalink.Domain.Enums;

namespace MetaLink.Application.Responses
{
    public class ParentStudentManagementResponse
    {
        public List<ParentResponse> Parents { get; set; }
    }

    public class ParentResponse
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Phone { get; set; }
        public string Pin { get; set; }
        public bool IsActive { get; set; }
        public DateTime? DateOfBirth { get; set; }

        public List<StudentResponse>? Students { get; set; }
    }

    public class StudentResponse
    {
        public int StudentID { get; set; }
        public int UserID { get; set; }
        public int? SelectedAvatarID { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public int? Class { get; set; }
        public bool? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public DateTime? CreateDate { get; set; }
        public DateTime? UpdateDate { get; set; }
        public int? ThemeChoice { get; set; }
        public bool LearningStyleCompleated { get; set; }
        public LearningStyleEnum? LearningStyleType { get; set; }
        public string? Role { get; set; }
    }
}
