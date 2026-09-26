function [x,y] = bitrate(ipt, ps, k, steps, unit, time_unit)
%function [x,y] = bitrate(ipt, ps, k, steps, unit, time_unit)
% ipt:		inter packet times
% ps:		vector of packet sizes (set to a single value to calculate the packet rate)
% k:		sampling period of the calculated rate
% steps:	how many samples to compute
% unit:
% 		set unit = 1 to have byte rate
% 		set unit = 8 to have bit rate (unaffected if packet rate is requested)
% time_unit:
%		if ipt are expressed in seconds set to 1
%		if ipt are exepressed in ms set to 1000
%		etc..
%
% Note that ps() has one more element than ipt() !
%
% Output:
% x:		time ticks
% y:		corresponding rate for each tick
%
% TODO:
%
% - to be able to accept timestamps instead of IPTs as an input
%

% Copyright (c) 2004-2006 Alessio Botta, Alberto Dainotti, Antonio Pescapè
% Email: {a.botta , alberto , pescape }@unina.it
% DIS - Dipartimento di Informatica e Sistemistica 
% University of Napoli Federico II, ITALY
% All rights reserved.
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

t = 0; % time
i = 1; % vectors index
j = 1; % steps index

% If "ps" is not a vector, then calculate the packet rate 
if length(ps) == 1
	ps = ones(1,length(ipt)+1);
	unit = 1;
end

ipt = ipt / time_unit;

y(j) = ps(i) * unit; % First packet comes at time zero and has no corresponding interarrival time
			% Note that ps() has one more element than ipt() !
			% For the programmer: if you prefer to have vectors of equal size, with the
			% first interarrival set to 0, then:
			%	- delete this line
			%	- move "y(j) = 0;" from the end of the main cycle to its start
			%	- change ps(i+1) to ps(i) in the first inner cycle

% Do "steps" steps
while (j <= steps)
	% For each step, while time of next pkt is smaller/eq. of next tick, do:
	while ((t + ipt(i)) < (j * k))
		t = t + ipt(i); % update current time
		y(j) = y(j) + (ps(i+1) * unit); % add size of current packet
		i = i + 1; % go to the next packet
		% Stupid check
		if (i > length(ipt))
			break;
		end
	end
	% Stupid check
	if (i > length(ipt))
		break;
	end

	% Next time is outside current step. Increase step.
	j = j + 1;

	% Check if there are empty steps
	while ((t + ipt(i)) >= (j * k))
		y(j) = 0;
		j = j + 1; 
	end

	y(j) = 0;
end

x = 0:1:j-1;

fprintf('Average rate: %d\n', mean(y));
fprintf('Standard deviation: %d\n', std(y));
