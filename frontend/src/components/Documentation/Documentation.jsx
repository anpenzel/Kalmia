import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Icon } from '@iconify/react';
import { AuthContext } from '../../context/AuthContext';
import instance from '../../api/AxiosInstance';
import EditDocumentModal from '../CreateDocumentModal/EditDocumentModal';
import DeleteModal from '../DeleteModal/DeleteModal';
import CreatePageGroup from '../CreatePageGroup/CreatePageGroup';
import { toastMessage } from '../../utils/Toast';
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import { getFormattedDate, handleError } from '../../utils/Common';
import {
  getPageGroups, getPages, getDocumentations, getDocumentation,
  deleteDocumentation, updateDocumentation, deletePageGroup,
  updatePageGroup, createPageGroup
} from '../../api/Requests';

export default function Documentation () {
  const navigate = useNavigate();
  const { refresh, refreshData, user } = useContext(AuthContext);
  const [searchParam] = useSearchParams();
  const docId = searchParam.get('id');

  const [loading, setLoading] = useState(false);

  // Documentation CRUD
  const [documentData, setDocumentData] = useState([]);
  const [isEditModal, setIsEditModal] = useState(false);
  const [isDeleteModal, setDeleteModal] = useState(false);

  // pageGroup CRUD
  const [isEditpageGroup, setIsEditpageGroup] = useState(false);
  const [isPageGroupsDeleteModal, setIsPageGroupsDeleteModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const [openCreatePageGroup, setOpenCreatePageGroup] = useState(false);

  const [fetchPageGroups, setFetchPageGroup] = useState([]);
  const [fetchPage, setFetchPage] = useState([]);
  const [documentationData, setDocumentationData] = useState([]);
  const [refreshPage, setRefreshpage] = useState(false);
  const [smallestId, setSmallestId] = useState([]);

  const handleRefresh = () => {
    setRefreshpage(!refreshPage);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [
        pageGroupsResult,
        pagesResult
      ] = await Promise.all([getPageGroups(), getPages()]);

      handleError(pageGroupsResult, navigate);
      handleError(pagesResult, navigate);

      if (pageGroupsResult.status === 'success') {
        setFetchPageGroup(pageGroupsResult.data || []);
      }

      if (pagesResult.status === 'success') {
        setFetchPage(pagesResult.data || []);
      }
    };

    fetchData();
  }, [user, navigate, refreshPage, refresh]);

  useEffect(() => {
    const combineData = () => {
      let filteredGroups = [];
      let filteredPages = [];

      if (fetchPageGroups.length > 0 && fetchPage.length > 0) {
        filteredGroups = fetchPageGroups.filter((obj) => !obj.parentId);
        filteredPages = fetchPage.filter((obj) => !obj.pageGroupId);
      } else if (fetchPageGroups.length > 0) {
        filteredGroups = fetchPageGroups.filter((obj) => !obj.parentId);
      } else if (fetchPage.length > 0) {
        filteredPages = fetchPage.filter((obj) => !obj.pageGroupId);
      } else {
        return [];
      }

      const combinedPages = [...filteredGroups, ...filteredPages];

      combinedPages.sort((a, b) => {
        const orderA = a.order !== null ? a.order : Infinity;
        const orderB = b.order !== null ? b.order : Infinity;

        if (orderA !== orderB) {
          return orderA - orderB;
        } else {
          return combinedPages.indexOf(a) - combinedPages.indexOf(b);
        }
      });

      setDocumentationData(combinedPages);
    };

    combineData();
  }, [fetchPageGroups, fetchPage, refresh]);

  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  const filteredItems = documentationData.filter(
    (obj) =>
      obj.documentationId === (docId ? Number(docId) : smallestId) &&
      (obj.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.title?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    const fetchData = async () => {
      const documentationsResult = await getDocumentations();

      if (handleError(documentationsResult, navigate)) {
        return;
      }

      if (documentationsResult.status === 'success') {
        const data = documentationsResult.data;
        const smallestId = data.reduce(
          (min, doc) => (doc.id < min ? doc.id : min),
          data[0]?.id
        );
        setSmallestId(smallestId);

        const idToFetch = docId ? Number(docId) : smallestId;
        const documentationResult = await getDocumentation(idToFetch);

        if (handleError(documentationResult, navigate)) {
          return;
        }

        if (documentationResult.status === 'success') {
          setDocumentData(documentationResult.data);
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [docId, refresh, refreshPage, user, navigate]);

  const handleDeletemodalopen = () => {
    setDeleteModal(true);
  };

  const handleCancel = () => {
    setDeleteModal(false);
  };

  const handleDelete = async () => {
    const result = await deleteDocumentation(Number(docId));

    if (handleError(result, navigate)) {
      return;
    }

    if (result.status === 'success') {
      setDeleteModal(false);
      toastMessage(result.data.message, 'success');
      refreshData();
      navigate('/dashboard');
    }
  };

  const handleEditClose = () => {
    setIsEditModal(!isEditModal);
  };

  const handleUpdate = async (editTitle, editDescription) => {
    const result = await updateDocumentation({
      id: Number(docId),
      name: editTitle,
      description: editDescription
    });

    if (handleError(result, navigate)) {
      return;
    }

    if (result.status === 'success') {
      setIsEditModal(false);
      refreshData();
      toastMessage(result.data.message, 'success');
    }
  };

  const openDeletePageGroups = (item) => {
    setCurrentItem(item);
    setIsPageGroupsDeleteModal(true);
  };

  const handleCancelPagegroupDelete = () => {
    setIsPageGroupsDeleteModal(false);
    setCurrentItem(null);
  };

  const handleDeletePageGroup = async (id) => {
    const result = await deletePageGroup(Number(id));

    if (handleError(result, navigate)) {
      return;
    }

    if (result.status === 'success') {
      setIsPageGroupsDeleteModal(false);
      toastMessage(result.data.message, 'success');
      navigate(`/dashboard/documentation?id=${docId}`);
      handleRefresh();
    }
  };

  const openEditPageGroup = (item) => {
    setCurrentItem(item);
    setIsEditpageGroup(true);
  };

  const handleEditPageGroupClose = () => {
    setIsEditpageGroup(false);
    setCurrentItem(null);
  };

  const handlePageGroupUpdate = async (editTitle, editDescription, id) => {
    const result = await updatePageGroup({
      id: Number(id),
      name: editTitle,
      documentationId: Number(docId)
    });

    if (handleError(result, navigate)) {
      return;
    }

    if (result.status === 'success') {
      setIsEditpageGroup(false);
      refreshData();
      toastMessage(result.data.message, 'success');
    }
  };

  const CreatePageGroupModalClose = () => {
    setOpenCreatePageGroup(false);
  };

  const handleCreatePageGroup = async (title) => {
    if (title === '') {
      toastMessage('Title is required. Please Enter PageGroup title', 'warning');
      return;
    }

    const result = await createPageGroup({
      name: title,
      documentationId: Number(docId)
    });

    if (handleError(result, navigate)) {
      return;
    }

    if (result.status === 'success') {
      setOpenCreatePageGroup(false);
      refreshData();
      toastMessage(result.data.message, 'success');
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }

    const newItems = Array.from(documentationData);
    const [reorderedItem] = newItems.splice(result.source.index, 1);

    newItems.splice(result.destination.index, 0, reorderedItem);

    setDocumentationData(newItems);

    const updateOrder = async (item, index) => {
      try {
        const endpoint = item?.name
          ? '/docs/page-group/reorder'
          : '/docs/page/reorder';
        await instance.post(endpoint, {
          id: item.id,
          documentationId: docId,
          order: index
        });
      } catch (err) {
        console.error(err);
        if (!err.response || err?.response?.status === 500) {
          toastMessage(err?.message, 'error');
          navigate('/server-down');
          return;
        }
        toastMessage(err?.response?.data?.message, 'error');
      }
    };

    await Promise.all(newItems.map((item, index) => updateOrder(item, index)));
    handleRefresh();
  };

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('Version 1.0'); // Default version
  const versions = [
    'Version 1.0',
    'Version 1.1',
    'Version 1.2',
    'Version 2.0',
    'Version 2.1'
  ];

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleSearchVersionChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleVersionSelect = (version) => {
    setSelectedVersion(version);
    setShowDropdown(false); // Close dropdown after selection
  };

  const filteredOptions = versions.filter((version) =>
    version.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence className='bg-gray-50 dark:bg-gray-900 p-3 sm:p-5'>
      <Breadcrumb />

      {/* Create pageGroup resusable component */}
      {openCreatePageGroup && (
        <CreatePageGroup
          closeModal={CreatePageGroupModalClose}
          handleCreate={handleCreatePageGroup}
          key='create-page-group-0'
        />
      )}

      {/* Edit Documentation component */}
      {isEditModal && (
        <EditDocumentModal
          heading='Edit Documentation'
          value={documentData.id}
          docId={documentData.id}
          title={documentData.name}
          description={documentData.description}
          closeModal={handleEditClose}
          updateData={handleUpdate}
        />
      )}

      {/* Delete Documentation Component */}
      {isDeleteModal && (
        <DeleteModal
          cancelModal={handleCancel}
          deleteDoc={handleDelete}
          id={documentData.id}
          title='Are you sure?'
          message={`You're permanently deleting "${documentData.name}"`}
        />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className=' lg:mt-0 lg:col-span-5 flex justify-end mr-5 gap-3'
        key='documentation-actions'
      >
        <motion.button
          whilehover={{ scale: 1.3 }}
          title='Clone Documentation'
        >
          <Icon
            icon='clarity:clone-line'
            className='w-6 h-6 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-700'
          />
        </motion.button>

        <motion.button
          whilehover={{ scale: 1.3 }}
          onClick={() => setIsEditModal(!isEditModal)}
          title='Edit Documentation'
        >
          <Icon
            icon='material-symbols:edit-outline'
            className='w-6 h-6 text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-600'
          />
        </motion.button>

        <motion.button
          whilehover={{ scale: 1.3 }}
          onClick={handleDeletemodalopen}
          title='Delete Documentation'
        >
          <Icon
            icon='material-symbols:delete'
            className='w-6 h-6 text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-600'
          />
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='grid max-w-screen-xl'
        key='documentation-info'
      >
        <div className='mr-auto place-self-center lg:col-span-7'>
          <h1 className='max-w-xl mb-4 text-4xl font-bold tracking-tight leading-none md:text-4xl xl:text-4xl dark:text-white'>
            {documentData.name}
          </h1>
          <p className='max-w-2xl mb-6 font-light text-gray-700 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400'>
            {documentData.description}
          </p>
        </div>
      </motion.div>

      {filteredItems && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.1 }}
          className=''
          key='documentation-table'
        >
          <div className='bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden'>
            <div className='flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4'>
              <div className='w-full md:w-1/3'>
                <div className='flex items-center'>
                  <label htmlFor='simple-search' className='sr-only'>
                    Search
                  </label>
                  <div className='relative w-full'>
                    <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
                      <Icon
                        icon='material-symbols:search'
                        className='w-6 h-6 text-gray-400 dark:text-gray-500'
                      />
                    </div>
                    <input
                      type='text'
                      id='simple-search'
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
                      placeholder='Search'
                    />
                  </div>
                </div>
              </div>

              <div className='relative inline-block border-black'>
                <div
                  id='dropdownSelect'
                  className='flex items-center border border-gray-400 hover:bg-gray-200 px-3 py-1.5 rounded-lg cursor-pointer dark:bg-gray-600 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-white'
                  onClick={toggleDropdown}
                >
                  {selectedVersion} {/* Display the selected version */}
                  <svg
                    className='w-2.5 h-2.5 ms-3'
                    aria-hidden='true'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 10 6'
                  >
                    <path
                      stroke='currentColor'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='m1 1 4 4 4-4'
                    />
                  </svg>
                </div>

                {showDropdown && (
                  <div
                    id='dropdownSearch'
                    className='z-10  absolute bg-white rounded-lg shadow w-52 dark:bg-gray-700'
                  >
                    <div className='p-1 h-auto w-full'>
                      <label htmlFor='input-group-search' className='sr-only'>
                        Search
                      </label>
                      <div className='relative'>
                        <input
                          type='text'
                          id='input-group-search'
                          className='block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                          placeholder='Search version'
                          value={searchQuery}
                          onChange={handleSearchVersionChange}
                        />
                      </div>

                      <ul className='h-auto w-full mt-2 overflow-y-auto text-sm text-gray-700 dark:text-gray-200' aria-labelledby='dropdownSelect'>
                        {filteredOptions.length > 0 ? (
                          filteredOptions.map((option, index) => (
                            <li key={index} className='relative w-full'>
                              <div
                                className=' flex items-center ps-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer'
                                onClick={() => handleVersionSelect(option)}
                              >
                                <p className='w-full p-3 ms-2 text-md font-medium text-gray-900 rounded dark:text-gray-300'>
                        {option}
                      </p>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li>
                            <div className='flex items-center ps-2 rounded'>
                              <span className='w-full py-2 ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300'>No options found</span>
                            </div>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className='w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3 flex-shrink-0'>
                <motion.button
                  whilehover={{ scale: 1.1 }}
                  onClick={() => setOpenCreatePageGroup(true)}
                  type='button'
                  className='flex items-center justify-center text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800'
                >
                  <span className=' px-1 text-left items-center dark:text-white text-md '>
                    New Group
                  </span>
                  <Icon icon='ei:plus' className='w-6 h-6 dark:text-white' />
                </motion.button>

                <motion.button whilehover={{ scale: 1.1 }}>
                  <Link
                    to={`/dashboard/documentation/create-page?id=${docId}&dir=true`}
                    className='flex items-center justify-center text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800'
                  >
                    <span className='px-1 text-left items-center dark:text-white text-md'>
                      New Page
                    </span>
                    <Icon icon='ei:plus' className='w-6 h-6 dark:text-white' />
                  </Link>
                </motion.button>
              </div>
            </div>

            {filteredItems && (
              <div className='overflow-x-auto h-auto'>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId='table' type='TABLE'>
                    {(provided) => (
                      <table className='w-full text-sm text-left text-gray-500 dark:text-gray-400'>
                        <thead className='text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400'>
                          <tr>
                            <th />
                            <th scope='col' className='px-4 py-3'>
                              Title
                            </th>
                            <th
                              scope='col'
                              className='px-4 py-3 whitespace-nowrap'
                            >
                              Author / Editor
                            </th>
                            <th
                              scope='col'
                              className='px-4 py-3 whitespace-nowrap'
                            >
                              Create / update
                            </th>
                            <th scope='col' className='px-4 py-3' />
                          </tr>
                        </thead>

                        <tbody
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {loading
                            ? (
                              <tr className='border-b dark:border-gray-700'>
                                <td colSpan='12' className='p-8'>
                                  <div className='flex flex-col items-center justify-center'>
                                    {loading && (
                                      <Icon
                                        icon='line-md:loading-twotone-loop'
                                        className='w-32 h-32'
                                      />
                                    )}
                                  </div>
                                </td>
                              </tr>
                              )
                            : !filteredItems === null ||
                            filteredItems.length <= 0
                                ? (
                                  <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className='border-b dark:bg-gray-700'
                                  >
                                    <td colSpan='12' className='text-center p-8'>
                                      <h1 className='text-center text-gray-600 sm:text-lg font-semibold'>
                                        No Pages Found
                                      </h1>
                                    </td>
                                  </motion.tr>
                                  )
                                : (
                                    filteredItems.map((obj, index) => (
                                      <Draggable key={obj.name ? `pageGroup-${obj.id}` : `page-${obj.id}`} draggableId={obj.name ? `pageGroup-${obj.id}` : `page-${obj.id}`} index={index}>
                                        {(provided, snapshot) => (
                                          <tr
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`${
                                      snapshot.isDragging
                                        ? 'opacity-80 bg-gray-200 dark:bg-gray-500 border shadow-md shadow-black text-black'
                                        : ''
                                    } border dark:border-gray-700 h-16`}
                                            key={`${obj.id}-${index}`}
                                          >
                                            <th
                                              scope='row'
                                              className='items-center w-5 cursor-pointer gap-2 px-4 py-3 font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap dark:text-white '
                                            >
                                              <Icon
                                                icon='nimbus:drag-dots'
                                                className='w-6 h-6 text-gray-600 dark:text-white'
                                              />
                                            </th>

                                            <th
                                              scope='row'
                                              className={`${
                                        snapshot.isDragging
                                          ? 'text-black'
                                          : 'text-blue-600'
                                      }  cursor-pointer  px-4 py-3 font-medium  hover:text-blue-800 whitespace-nowrap dark:text-white`}
                                            >
                                              <Link
                                                className='flex items-center gap-1'
                                                to={
                                          obj.name
                                            ? `/dashboard/documentation/page-group?id=${docId}&pageGroupId=${obj.id}&groupName=${obj.name}`
                                            : `/dashboard/documentation/edit-page?id=${docId}&dir=true&pageId=${obj.id}&pageName=${obj.title}`
                                        }
                                              >
                                                {obj.name
                                                  ? (
                                                    <Icon icon='clarity:folder-solid' className='w-6 h-6' />
                                                    )
                                                  : (
                                                    <Icon icon='iconoir:page' className='w-6 h-6 text-gray-500 dark:text-white' />
                                                    )}

                                                {obj.name || obj.title}
                                              </Link>
                                            </th>

                                            <td className='px-4 py-3 cursor-text'>
                                              <div className='flex justify-start items-center gap-2'>
                                                <Icon
                                                  icon='mdi:user'
                                                  className='w-4 h-4 text-gray-500 dark:text-white'
                                                />
                                                <span className=' px-1 text-left items-center dark:text-white text-md whitespace-nowrap'>
                                                  {obj.author.username}
                                                </span>
                                              </div>
                                              <div className='flex gap-2 items-center'>
                                                <Icon
                                                  icon='mdi:edit-outline'
                                                  className='w-4 h-4 text-gray-500 dark:text-white'
                                                />
                                                <span className=' px-1 text-left items-center dark:text-white text-md whitespace-nowrap'>
                                                  {
                                                    (obj.editors).filter((editor) => editor.id === obj.lastEditorId)[0]?.username || obj.editors[0]?.username
                                                  }
                                                </span>
                                              </div>
                                            </td>

                                            <td className='px-4 py-3 cursor-text'>
                                              <div className='flex justify-start items-center gap-2' title='Creation Date'>
                                                <Icon
                                                  icon='mdi:clock-plus-outline'
                                                  className='w-4 h-4 text-gray-500 dark:text-white'
                                                />
                                                <span className=' px-1 text-left items-center dark:text-white text-md whitespace-nowrap'>
                                                  {getFormattedDate(obj.createdAt)}
                                                </span>
                                              </div>
                                              <div
                                                className='flex gap-2 items-center'
                                                title='Last Update Date'
                                              >
                                                <Icon
                                                  icon='mdi:clock-edit-outline'
                                                  className='w-4 h-4 text-gray-500 dark:text-white'
                                                />
                                                <span className=' px-1 text-left items-center dark:text-white text-md whitespace-nowrap'>
                                                  {getFormattedDate(obj.updatedAt)}
                                                </span>
                                              </div>
                                            </td>

                                            {obj.name && (
                                              <td className='px-4 py-3 cursor-pointer relative'>
                                                <button
                                                  id={`dropdown-button-${obj.id}`}
                                                  data-dropdown-toggle={`dropdown123-${obj.id}`}
                                                  className='inline-flex items-center gap-3 p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100'
                                                  type='button'
                                                >
                                                  <Icon
                                                    icon='material-symbols:edit-outline' className='w-6 h-6 text-yellow-500 dark:text-yellow-400' onClick={() => {
                                                      openEditPageGroup(obj);
                                                    }}
                                                  />
                                                  <Icon
                                                    icon='material-symbols:delete'
                                                    className='w-6 h-6 text-red-600 dark:text-red-500'
                                                    onClick={() => {
                                                      openDeletePageGroups(obj);
                                                    }}
                                                  />
                                                </button>
                                              </td>
                                            )}
                                          </tr>
                                        )}
                                      </Draggable>
                                    ))
                                  )}
                          {provided.placeholder}
                        </tbody>
                      </table>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            )}

            {/* PageGroup Edit Component */}
            {isEditpageGroup && currentItem && (
              <EditDocumentModal
                heading='Rename Page Group'
                title={currentItem.name}
                id={currentItem.id}
                closeModal={handleEditPageGroupClose}
                updateData={handlePageGroupUpdate}
              />
            )}

            {/* PageGroup delete Component */}
            {isPageGroupsDeleteModal && currentItem && (
              <DeleteModal
                cancelModal={handleCancelPagegroupDelete}
                deleteDoc={() => handleDeletePageGroup(currentItem.id)}
                id={currentItem.id}
                title='Are you sure?'
                message={`You're permanently deleting "${currentItem.name}`}
              />
            )}
          </div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
