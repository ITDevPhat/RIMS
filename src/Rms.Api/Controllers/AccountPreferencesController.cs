using Microsoft.AspNetCore.Mvc;
using Rms.Application.Admin;

namespace Rms.Api.Controllers;

[Route("api/account/preferences")]
public sealed class AccountPreferencesController : ApiControllerBase
{
    private readonly IAccountPreferenceService _accountPreferenceService;

    public AccountPreferencesController(IAccountPreferenceService accountPreferenceService)
    {
        _accountPreferenceService = accountPreferenceService;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        return OkResponse(await _accountPreferenceService.GetAsync(cancellationToken));
    }

    [HttpPut]
    public async Task<IActionResult> Update(UpdatePreferenceRequest request, CancellationToken cancellationToken)
    {
        return OkResponse(await _accountPreferenceService.UpdateAsync(request, cancellationToken));
    }
}
