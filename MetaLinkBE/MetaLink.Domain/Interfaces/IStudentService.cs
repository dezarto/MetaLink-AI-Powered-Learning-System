using Metalink.Domain.Entities;

namespace Metalink.Domain.Interfaces
{
    public interface IStudentService
    {
        Task<Student> CreateStudentAsync(Student student);
        Task<List<Student>> GetStudentsByUserIdAsync(int userId);
        Task<Student> GetByIdAsync(int studentId);
        Task<Student> UpdateStudentAsync(Student student);
        Task DeleteStudentAsync(Student student);
        Task<Student> UpdateThemeChoiceAsync(int studentId, int? themeChoice);
    }
}
