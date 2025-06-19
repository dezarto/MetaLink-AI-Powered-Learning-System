using Metalink.Application.DTOs;
using MetaLink.Application.Requests;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Metalink.Application.Interfaces
{
    public interface IStudentCourseAppService
    {
        Task<List<StudentCourseDTO>> GetByCourseIdAsync(int courseId);
        Task<StudentCourseDTO> EnrollCourseAsync(int studentId, EnrollCourseRequest request);
        // New: list enrollments for a given student
        Task<List<StudentCourseDTO>> GetByStudentIdAsync(int studentId);
    }
}
