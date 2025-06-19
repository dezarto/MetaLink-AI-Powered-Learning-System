using MetaLink.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MetaLink.Application.Responses
{
    public class ColorBlindTestResponse
    {
        public ColorBlindTypeEnum ColorBlindType { get; set; }
        public bool Success { get; set; }
    }
}
