import TaskCard from "../components/TaskCard";

function Taskspage() {
    const tasks = [
        {
            id: 1,
            title: "Learn React Components",
            priority: "High"
        },
        {
            id: 2,
            title: "Solve 5 Array Problems",
            priority: "Medium"
        },
        {
            id: 3,
            title: "Update Resume",
            priority: "Low"
        }
    ];
    return (
        <>
            <h1>tasks page</h1>
            {
                tasks.map((task) =>
                    <TaskCard title={task.title} priority={task.priority} />
                )
            }
            
        </>
    );
}
export default Taskspage