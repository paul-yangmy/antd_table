import React from 'react';
import { connect } from 'dva';
import { Table, Card, Divider, Input, InputNumber, Button, Popconfirm, Form } from 'antd';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { DndProvider, DragSource, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import update from 'immutability-helper';

// 拖拽实现
let dragingIndex = -1;

class BodyRow extends React.Component {
  render() {
    // console.log(this.props);
    const { isOver, connectDragSource, connectDropTarget, moveRow, ...restProps } = this.props;
    const style = { ...restProps.style, cursor: 'move' };

    let { className } = restProps;
    if (isOver) {
      if (restProps.index > dragingIndex) {
        className += ' drop-over-downward';
      }
      if (restProps.index < dragingIndex) {
        className += ' drop-over-upward';
      }
    }

    return connectDragSource(
      connectDropTarget(<tr {...restProps} className={className} style={style} />),
    );
  }
}

const rowSource = {
  beginDrag(props) {
    dragingIndex = props.index;
    return {
      index: props.index,
    };
  },
};

const rowTarget = {
  drop(props, monitor) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Time to actually perform the action
    props.moveRow(dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex;
  },
};

const DragableBodyRow = DropTarget('row', rowTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
}))(
  DragSource('row', rowSource, connect => ({
    connectDragSource: connect.dragSource(),
  }))(BodyRow),
);

// 编辑修改子框
const EditableContext = React.createContext();

class EditableCell extends React.Component {
  getInput = () => {
    if (this.props.inputType === 'number') {
      return <InputNumber />;
    }
    return <Input />;
  };

  renderCell = ({ getFieldDecorator }) => {
    const {
      editing,
      dataIndex,
      title,
      inputType,
      record,
      index,
      children,
      ...restProps
    } = this.props;
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item style={{ margin: 0 }}>
            {getFieldDecorator(dataIndex, {
              rules: [
                {
                  required: true,
                  message: `Please Input ${title}!`,
                },
              ],
              initialValue: record[dataIndex],
            })(this.getInput())}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  render() {
    return <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>;
  }
}
// 添加
const EditableRow = ({ form, index, ...props }) => (
  <EditableContext.Provider value={form}>
    <tr {...props} />
  </EditableContext.Provider>
);

const EditableFormRow = Form.create()(EditableRow);
class EditableCell2 extends React.Component {
  state = {
    editing: false,
  };

  toggleEdit = () => {
    const editing = !this.state.editing;
    this.setState({ editing }, () => {
      if (editing) {
        this.input.focus();
      }
    });
  };

  save = e => {
    const { record, handleSave } = this.props;
    this.form.validateFields((error, values) => {
      if (error && error[e.currentTarget.id]) {
        return;
      }
      this.toggleEdit();
      handleSave({ ...record, ...values });
    });
  };

  renderCell = form => {
    this.form = form;
    const { children, dataIndex, record, title } = this.props;
    const { editing } = this.state;
    return editing ? (
      <Form.Item style={{ margin: 0 }}>
        {form.getFieldDecorator(dataIndex, {
          rules: [
            {
              required: true,
              message: `${title} is required.`,
            },
          ],
          initialValue: record[dataIndex],
        })(<Input ref={node => (this.input = node)} onPressEnter={this.save} onBlur={this.save} />)}
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{ paddingRight: 24 }}
        onClick={this.toggleEdit}
      >
        {children}
      </div>
    );
  };

  render() {
    const {
      editable,
      dataIndex,
      title,
      record,
      index,
      handleSave,
      children,
      ...restProps
    } = this.props;
    return (
      <td {...restProps}>
        {editable ? (
          <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>
        ) : (
          children
        )}
      </td>
    );
  }
}
//-------------------
@connect(({ instance, loading }) => ({
  instance,
  loading: loading.effects['instance/query'],
}))
class EditableTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = { instance: [], editingKey: '', count: 0 };
    this.columns = [
      {
        title: '实例名',
        dataIndex: 'name',
        key: 'name',
        editable: true,
        render: text => (
          <a href="https://baidu.com" target="_blank">
            {
              //浏览器总在一个新打开、未命名的窗口中载入目标文档。
              text
            }{' '}
          </a>
        ),
      },
      {
        title: '区域',
        dataIndex: 'area',
        key: 'area',
        editable: true,
        // render: () => Area[this.state.region],
      },
      {
        title: '状态',
        dataIndex: 'state',
        key: 'state',
        editable: true,
      },
      {
        title: 'Spark版本',
        dataIndex: 'version',
        key: 'version',
        editable: true,
      },
      {
        title: '运行中应用',
        dataIndex: 'runningApplication',
        key: 'runningApplication',
        editable: true,
      },
      {
        title: '实际slot数',
        dataIndex: 'slot',
        key: 'slot',
        editable: true,
      },
      {
        title: '使用内存',
        dataIndex: 'memoryUsed',
        key: 'memoryUsed',
        editable: true,
        render: text => `${text}M`,
      },
      {
        title: '操作',
        dataIndex: 'operation',
        render: (text, record) => {
          const { editingKey } = this.state;
          const editable = this.isEditing(record);
          return editable ? (
            <span>
              <Popconfirm title="确定要删除吗？" onConfirm={() => this.handleDelete(record)}>
                {/* {console.log(record)} */}
                <a> 删除</a>
              </Popconfirm>
              <Divider type="vertical" />
              <EditableContext.Consumer>
                {form => (
                  <a onClick={() => this.save(form, record.name)} style={{ marginRight: 8 }}>
                    保存
                  </a>
                )}
              </EditableContext.Consumer>
              <Divider type="vertical" />
              <Popconfirm title="确定放弃修改么?" onConfirm={() => this.cancel(record.name)}>
                <a>取消</a>
              </Popconfirm>
            </span>
          ) : (
            <div>
              <Popconfirm title="确定要删除吗？" onConfirm={() => this.handleDelete(record)}>
                {/* {console.log(record)} */}
                <a> 删除</a>
              </Popconfirm>
              <Divider type="vertical" />
              <a
                disabled={editingKey !== '' /*是否禁用点击属性*/}
                onClick={() => this.edit(record.name)}
              >
                编辑
              </a>
            </div>
          );
        },
      },
    ];
  }
  isEditing = record => record.name === this.state.editingKey;
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'instance/query',
      callback: (inst, count) => this.setState({ instance: inst, count: inst.length }),
    });
  }
  // setState(updater, callback)这个方法是用来告诉react组件数据有更新，有可能需要重新渲染。
  // 它是异步的,react通常会集齐一批需要更新的组件，然后一次性更新来保证渲染的性能:
  // 即那就是在使用setState改变状态之后，立刻通过this.state去拿最新的状态往往是拿不到的（this.props未变）。
  // 1.setState 不会立刻改变React组件中state的值.
  // 2.setState 通过触发一次组件的更新来引发重绘.
  // 3.多次 setState 函数调用产生的效果会合并。

  cancel = () => {
    this.setState({ editingKey: '' });
  };

  save(form, key) {
    form.validateFields((error, row) => {
      if (error) {
        return;
      }
      const newData = [...this.state.instance];
      // console.log(newData)
      const index = newData.findIndex(item => key === item.name);
      // console.log(index)
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          ...row,
        });
        this.setState({ instance: newData, editingKey: '' });
      } else {
        newData.push(row);
        this.setState({ instance: newData, editingKey: '' });
      }
    });
  }

  edit(key) {
    console.log(key);
    this.setState({ editingKey: key });
  }
  handleDelete = data => {
    console.log(this.state);
    const { instance } = this.state;
    const newInstance = [...instance];
    // console.log(instance)
    // console.log(instance.length)
    for (var i = 0; i < instance.length; i++) {
      if (instance[i].name == data.name) {
        var index = i;
      }
    }
    //赋值给新数组来避免setState不能及时渲染
    newInstance.splice(index, 1);
    // instance.splice(index,1)
    // console.log(instance)
    // this.setState(instance)
    this.setState({ instance: newInstance });
  };

  moveRow = (dragIndex, hoverIndex) => {
    const { instance } = this.state;
    const dragRow = instance[dragIndex];

    this.setState(
      update(this.state, {
        instance: {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragRow],
          ],
        },
      }),
    );
  };
  handleAdd = () => {
    const { count, instance } = this.state;
    console.log(count);
    const newData = {
      name: 'string (e.g.: skySpark1)',
      area: 'string (e.g.: 亦庄总部生产区)',
      state: 'string (e.g.: 100%)',
      version: 'string (e.g.: 1.2.3)',
      runningApplication: 'int',
      slot: 'int',
      memoryUsed: 'int',
    };
    this.setState({
      instance: [...instance, newData],
      count: count + 1,
    });
  };
  handleSave = row => {
    const newData = [...this.state.instance];
    const index = newData.findIndex(item => row.name === item.name);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    this.setState({ instance: newData });
  };
  render() {
    const components = {
      body: {
        cell: EditableCell,
        row: DragableBodyRow,
        row2: EditableFormRow,
        cell2: EditableCell2,
      },
    };

    const columns = this.columns.map(col => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: record => ({
          record,
          dataIndex: col.dataIndex,
          title: col.title,
          editing: this.isEditing(record),
        }),
      };
    });

    return (
      <PageHeaderWrapper>
        <Button onClick={this.handleAdd} type="primary" style={{ marginBottom: 16 }}>
          添加
        </Button>
        <Card>
          <EditableContext.Provider value={this.props.form}>
            <DndProvider backend={HTML5Backend}>
              <Table
                components={components}
                dataSource={this.state.instance}
                columns={columns}
                rowClassName="editable-row"
                pagination={{ onChange: this.cancel }}
                onRow={(record, index) => ({ index, moveRow: this.moveRow })}
              />
            </DndProvider>
          </EditableContext.Provider>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

const EditableFormTable = Form.create()(EditableTable);
export default EditableFormTable;
