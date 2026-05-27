
import { useItems } from "./use-items";
import { useCreateItem } from "./use-create-item";
import { useUpdateItem } from "./use-update-item";
import { useDeleteItem } from "./use-delete-item";
import { useReorderItems } from "./use-reorder-items";

export function FormItemManager({ eventId }: { eventId: string }) {
		const { data: items, isLoading, isError, error } = useItems(eventId);

	// Mutation hooks
	const createItem = useCreateItem();
	const reorderItems = useReorderItems(eventId);

	if (isLoading) return <div>Loading items...</div>;
	if (isError) return <div>Error: {error?.message}</div>;

	const handleAddQuestion = () => {
		createItem.mutate({
			eventId,
			category: "question",
			value: "What is your name?",
			questionType: "text",
			required: true,
			metadata: { subtype: "short" },
		});
	};

	const handleReorder = (itemId: string, newOrder: number) => {
		reorderItems.mutate({ itemId, newOrder });
	};

	return (
		<div>
			<h2>Form Questions ({items?.length || 0})</h2>
			<button onClick={handleAddQuestion} disabled={createItem.isLoading}>
				{createItem.isLoading ? "Adding..." : "Add Question"}
			</button>

			<ul>
				{items?.map((item) => (
					<ItemRow
						key={item.id}
						item={item}
						eventId={eventId}
						onReorder={handleReorder}
					/>
				))}
			</ul>
		</div>
	);
}

export function BanterChatManager({ eventId }: { eventId: string }) {
		const { data: items, isLoading } = useItems(eventId, { enablePolling: true });

	// Mutation hook for sending chat messages
	const createItem = useCreateItem();

	const handleSendMessage = (message: string, participantId: string) => {
		createItem.mutate({
			eventId,
			category: "chat",
			value: message,
			participantId,
		});
	};

	if (isLoading) return <div>Loading chat...</div>;

	// Separate questions and chat messages
	const questions = items?.filter((item) => item.category === "question") || [];
	const chatMessages = items?.filter((item) => item.category === "chat") || [];

	return (
		<div>
			<div>
				<h3>Questions</h3>
				{questions.map((q) => (
					<div key={q.id}>{q.value}</div>
				))}
			</div>

			<div>
				<h3>Chat (polling every 3s)</h3>
				{chatMessages.map((msg) => (
					<div key={msg.id}>{msg.value}</div>
				))}
			</div>

			<button
				onClick={() => handleSendMessage("Hello!", "participant-123")}
				disabled={createItem.isLoading}
			>
				Send Message
			</button>
		</div>
	);
}

function ItemRow({
	item,
	eventId,
	onReorder,
}: {
	item: any;
	eventId: string;
	onReorder: (itemId: string, newOrder: number) => void;
}) {
	const updateItem = useUpdateItem(item.id, eventId);
	const deleteItem = useDeleteItem(item.id, eventId);

	const handleEdit = () => {
		updateItem.mutate({
			value: "Updated question text",
			required: !item.required,
		});
	};

	const handleDelete = () => {
		if (confirm("Delete this item?")) {
			deleteItem.mutate();
		}
	};

	const handleMoveUp = () => {
		// Move item up by setting order to 0.5 less
		onReorder(item.id, item.order - 0.5);
	};

	return (
		<li>
			<span>{item.value}</span>
			<span> (order: {item.order})</span>
			<button onClick={handleEdit} disabled={updateItem.isLoading}>
				Edit
			</button>
			<button onClick={handleDelete} disabled={deleteItem.isLoading}>
				Delete
			</button>
			<button onClick={handleMoveUp}>Move Up</button>
		</li>
	);
}

export function CompleteItemManagementExample({ eventId }: { eventId: string }) {
	const { data: items, refetch } = useItems(eventId);
	const createItem = useCreateItem();
	const reorderItems = useReorderItems(eventId);

	// Example: Create multiple items in sequence
	const handleCreateMultipleItems = async () => {
		try {
						await createItem.mutateAsync({
				eventId,
				category: "question",
				value: "What is your email?",
				questionType: "text",
				required: true,
				metadata: { subtype: "email" },
			});

						await createItem.mutateAsync({
				eventId,
				category: "question",
				value: "Rate your experience",
				questionType: "slider",
				required: false,
				metadata: { min: 1, max: 10 },
			});

						await createItem.mutateAsync({
				eventId,
				category: "question",
				value: "Choose your favorite color",
				questionType: "options",
				required: true,
				metadata: {
					multiple: false,
					choices: ["Red", "Blue", "Green"],
				},
			});

			// Refetch to get updated list
			await refetch();

			console.log("All items created successfully!");
		} catch (error) {
			console.error("Failed to create items:", error);
		}
	};

	// Example: Reorder items using decimal ordering
	const handleReorderExample = () => {
		if (!items || items.length < 2) return;

		// Move second item between first and third
		// If items are at order 1.0, 2.0, 3.0
		// Move item at 2.0 to position 1.5 (between 1.0 and 2.0)
		const secondItem = items[1];
		if (!secondItem) return;
		reorderItems.mutate({
			itemId: secondItem.id,
			newOrder: 1.5,
		});
	};

	return (
		<div>
			<h2>Complete Item Management Example</h2>

			<div>
				<button onClick={handleCreateMultipleItems}>
					Create Multiple Items
				</button>
				<button onClick={handleReorderExample}>Reorder Example</button>
			</div>

			<div>
				<h3>Current Items:</h3>
				<pre>{JSON.stringify(items, null, 2)}</pre>
			</div>
		</div>
	);
}

