function TaskCard(props){
    return (
        <div>
            <h3>Title:{props.title}</h3>
            <p>Priority:{props.priority}</p>
        </div>
    );
}

export default TaskCard