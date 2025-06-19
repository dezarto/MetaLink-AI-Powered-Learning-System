using Metalink.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Metalink.Domain.Interfaces
{
    public interface IStudentCourseRepository
    {
        Task<List<StudentCourse>> GetAllAsync();
        Task<StudentCourse?> GetByIdAsync(int id);
        Task<List<StudentCourse>> GetByCourseIdAsync(int courseId);
        // New: list enrollments for a given student
        Task<List<StudentCourse>> GetByStudentIdAsync(int studentId);
        Task AddAsync(StudentCourse studentCourse);
        Task SaveChangesAsync();
    }
}
