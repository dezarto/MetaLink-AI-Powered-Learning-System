using AutoMapper;
using Metalink.Application.DTOs;
using Metalink.Application.Interfaces;
using Metalink.Domain.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Metalink.Application.Services
{
    public class SubLessonAppService : ISubLessonAppService
    {
        private readonly ISubLessonRepository _subLessonRepository;
        private readonly IMapper _mapper;

        public SubLessonAppService(ISubLessonRepository subLessonRepository, IMapper mapper)
        {
            _subLessonRepository = subLessonRepository;
            _mapper = mapper;
        }

        public async Task<List<SubLessonDTO>> GetAllAsync()
        {
            var subs = await _subLessonRepository.GetAllAsync();
            return _mapper.Map<List<SubLessonDTO>>(subs);
        }

        public async Task<SubLessonDTO?> GetByIdAsync(int id)
        {
            var sub = await _subLessonRepository.GetByIdAsync(id);
            return sub == null ? null : _mapper.Map<SubLessonDTO>(sub);
        }

        public async Task<List<SubLessonDTO>> GetByLessonIdAsync(int lessonId)
        {
            var subs = await _subLessonRepository.GetByLessonIdAsync(lessonId);
            return _mapper.Map<List<SubLessonDTO>>(subs);
        }
    }
}
