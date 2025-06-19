namespace Metalink.Domain.Entities
{
    public class User
    {
        public int UserID { get; set; }
        public string Email { get; set; }
        public string Password { get; set; } 
        public string Pin { get; set; }
        public string FirstName { get; set; } 
        public string LastName { get; set; }
        public string Phone { get; set; } 
        public bool IsActive { get; set; } = true;

        public DateTime DateOfBirth { get; set; }
        public DateTime CreateDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string Role { get; set; } = "User";

        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpires { get; set; }
    }
}
