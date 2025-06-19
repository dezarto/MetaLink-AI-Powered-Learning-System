using AutoMapper;
using Metalink.Application.DTOs;
using Metalink.Application.Interfaces;
using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;
using MetaLink.Application.Requests;

namespace Metalink.Application.Services
{
    public class StudentCourseAppService : IStudentCourseAppService
    {
        private readonly IStudentCourseRepository _repository;
        private readonly IMapper _mapper;
        public StudentCourseAppService(IStudentCourseRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }
        public async Task<StudentCourseDTO> EnrollCourseAsync(int studentId, EnrollCourseRequest request)
        {
            var enrollment = new StudentCourse
            {
                StudentId = studentId,
                CourseId = request.CourseId,
                EnrollmentDate = System.DateTime.UtcNow
            };
            await _repository.AddAsync(enrollment);
            await _repository.SaveChangesAsync();
            return _mapper.Map<StudentCourseDTO>(enrollment);
        }
        public async Task<List<StudentCourseDTO>> GetByCourseIdAsync(int courseId)
        {
            var enrollments = await _repository.GetByCourseIdAsync(courseId);
            return _mapper.Map<List<StudentCourseDTO>>(enrollments);
        }
        public async Task<List<StudentCourseDTO>> GetByStudentIdAsync(int studentId)
        {
            var enrollments = await _repository.GetByStudentIdAsync(studentId);
            return _mapper.Map<List<StudentCourseDTO>>(enrollments);
        }
    }
}
