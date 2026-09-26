function [x,y]=bitrate2(time,ps,scale,unit,time_type,time_unit);
% function [x,y]=bitrate2(time,ps,scale,unit,time_type,time_unit);
% Gives sampled bitrate function.
%
% Input:
%
%   - time: Interarrival Packet Times or Timestamps (see time_type).
%
%   - ps: Packet Size vector (set to a single value to calculate packet rate).
%
%   - scale: sampling period of the calculated rate (in seconds)
%
%   - unit:
%     set unit = 1 to have byte rate
%     set unit = 8 to have bit rate (unaffected if packet rate is requested)
%
%   - time_type: format of vector "time".
%     1: Timestamps (default)
%     2: Interarrival Packet Times
%
%   - time_unit:
%	  if times are expressed in seconds set to 1
%	  if times are exepressed in ms set to 1000
%	  etc..
%
% Output:
%   - x:		time ticks
%   - y:		corresponding rate for each tick

% % Copyright (c) 2004-2006 Alessio Botta, Alberto Dainotti, Antonio Pescapè
% Email: {a.botta , alberto , pescape}@unina.it
% DIS - Dipartimento di Informatica e Sistemistica 
% University of Napoli Federico II, ITALY
% All rights reserved.
%
% Many thanks to Dario Pesole for his major code contributions
%
% Redistribution and use in source and binary forms, with or without
% modification, are permitted provided that the following conditions
% are met:
% 1. Redistributions of source code must retain the above copyright
%    notice, this list of conditions and the following disclaimer.
% 2. Redistributions in binary form must reproduce the above copyright
%    notice, this list of conditions and the following disclaimer in the
%    documentation and/or other materials provided with the distribution.
% 3. Redistributions of source code or in binary form must clearly reproduce
%    the reference to the web site from which they were downloaded.
%
% THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS ``AS IS'' AND
% ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
% IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
% ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE
% FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
% DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
% OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
% HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
% LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
% OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
% SUCH DAMAGE.

if unit ~= 8
    unit = 1;
end

if length(ps) == 1
    ps = ones(1, length(time) + 1);
end

if time_type == 2       % if time=IPT -> convert to timestamps, else don't do anything
    time = cumsum([0 time]);
    disp('time vector will be used as Interarrival Packet Times.');
else
    disp('time vector will be used as Timestamps.');
end

if length(time) ~= length(ps)
    warning('Vector sizes are different. The shortest length will be considered.');
end

Tmin = min(time);
Tmax = max(time);
scale = scale * time_unit;
tick = ceil((time - Tmin) / scale);		% identifies ticks for each timestamp
y = zeros(1, ceil((Tmax - Tmin) / scale));

y(1) = ps(1);					% first packet always goes in the first tick

for i = 2:min(length(time), length(ps))
    y(tick(i)) = y(tick(i)) + ps(i);		% update tick content with current packet size
end
y = y * unit;
x = 0:length(y) - 1;

fprintf('Average rate: %d\n', mean(y));
fprintf('Standard deviation: %d\n', std(y));
