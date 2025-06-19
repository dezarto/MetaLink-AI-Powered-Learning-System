using AutoMapper;
using Metalink.Application.DTOs;
using Metalink.Application.Interfaces;
using Metalink.Domain.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Metalink.Application.Services
{
    public class LessonAppService : ILessonAppService
    {
        private readonly ILessonRepository _lessonRepository;
        private readonly IMapper _mapper;

        public LessonAppService(ILessonRepository lessonRepository, IMapper mapper)
        {
            _lessonRepository = lessonRepository;
            _mapper = mapper;
        }

        public async Task<List<LessonDTO>> GetAllAsync()
        {
            var lessons = await _lessonRepository.GetAllAsync();
            return _mapper.Map<List<LessonDTO>>(lessons);
        }

        public async Task<LessonDTO?> GetByIdAsync(int id)
        {
            var lesson = await _lessonRepository.GetByIdAsync(id);
            return lesson == null ? null : _mapper.Map<LessonDTO>(lesson);
        }

        public async Task<List<LessonDTO>> GetByCourseIdAsync(int courseId)
        {
            var lessons = await _lessonRepository.GetByCourseIdAsync(courseId);
            return _mapper.Map<List<LessonDTO>>(lessons);
        }
    }
}
