
import { useParticipants } from "./use-participants";
import { useCreateParticipant } from "./use-create-participant";
import { useResponses } from "./use-responses";
import { useCreateResponse } from "./use-create-response";
import { useResponseAnalytics } from "./use-response-analytics";

export function EventParticipantsList({ eventId }: { eventId: string }) {
	const { data: participants, isLoading, isError, error } = useParticipants(eventId);
	const createParticipant = useCreateParticipant();

	const handleJoin = () => {
		createParticipant.mutate({
			eventId,
			alias: "Anonymous User",
		});
	};

	if (isLoading) return <div>Loading participants...</div>;
	if (isError) return <div>Error: {error?.message}</div>;

	return (
		<div>
			<h2>Participants ({participants?.length || 0})</h2>
			<ul>
				{participants?.map((participant) => (
					<li key={participant.id}>
						{participant.alias} - Joined: {new Date(participant.joinedAt).toLocaleDateString()}
					</li>
				))}
			</ul>
			<button onClick={handleJoin} disabled={createParticipant.isLoading}>
				{createParticipant.isLoading ? "Joining..." : "Join Event"}
			</button>
		</div>
	);
}

export function EventResponsesList({ eventId }: { eventId: string }) {
	const { data, isLoading, isError, error } = useResponses(eventId, 1, 20);

	if (isLoading) return <div>Loading responses...</div>;
	if (isError) return <div>Error: {error?.message}</div>;

	const { responses, pagination } = data || { responses: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };

	return (
		<div>
			<h2>Responses ({pagination.total})</h2>
			<ul>
				{responses.map((response) => (
					<li key={response.id}>
						Response ID: {response.id} - Submitted: {new Date(response.submittedAt).toLocaleDateString()}
					</li>
				))}
			</ul>
			<div>
				Page {pagination.page} of {pagination.totalPages}
			</div>
		</div>
	);
}

export function SubmitResponseForm({ eventId, participantId }: { eventId: string; participantId?: string }) {
	const createResponse = useCreateResponse();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		
		createResponse.mutate({
			eventId,
			participantId,
			answers: [
				{ itemId: "item-1", value: ["Answer 1"] },
				{ itemId: "item-2", value: ["Option A", "Option B"] },
			],
		});
	};

	return (
		<form onSubmit={handleSubmit}>
			<h2>Submit Response</h2>
			{/* Form fields would go here */}
			<button type="submit" disabled={createResponse.isLoading}>
				{createResponse.isLoading ? "Submitting..." : "Submit Response"}
			</button>
			{createResponse.isSuccess && <div>Response submitted successfully!</div>}
			{createResponse.isError && <div>Error: {createResponse.error?.message}</div>}
		</form>
	);
}

export function ResponseAnalyticsDashboard({ eventId }: { eventId: string }) {
	const { data: analytics, isLoading, isError, error } = useResponseAnalytics(eventId);

	if (isLoading) return <div>Loading analytics...</div>;
	if (isError) return <div>Error: {error?.message}</div>;

	return (
		<div>
			<h2>Response Analytics</h2>
			<div>
				<h3>Total Responses: {analytics?.totalResponses || 0}</h3>
			</div>
			<div>
				<h3>Response Trend</h3>
				<ul>
					{analytics?.responseTrend.map((trend) => (
						<li key={trend.date}>
							{trend.date}: {trend.count} responses
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

export function CompleteEventView({ eventId }: { eventId: string }) {
	return (
		<div>
			<h1>Event Dashboard</h1>
			
			<section>
				<EventParticipantsList eventId={eventId} />
			</section>

			<section>
				<ResponseAnalyticsDashboard eventId={eventId} />
			</section>

			<section>
				<EventResponsesList eventId={eventId} />
			</section>
		</div>
	);
}
