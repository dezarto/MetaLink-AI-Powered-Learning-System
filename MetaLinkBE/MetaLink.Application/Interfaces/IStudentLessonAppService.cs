using Metalink.Application.DTOs;
using MetaLink.Application.Requests;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Metalink.Application.Interfaces
{
    public interface IStudentLessonAppService
    {
        Task<List<StudentLessonDTO>> GetByLessonIdAsync(int lessonId);
        Task<StudentLessonDTO> EnrollLessonAsync(int studentId, EnrollLessonRequest request);
        // New: list enrollments for a given student
        Task<List<StudentLessonDTO>> GetByStudentIdAsync(int studentId);
    }
}
